package com.adotaaqui.exception;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.TypeMismatchException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

// Transforma toda exceção que escapa dos controllers no formato padrão de erro (docs/api.md, seção 4).
// Os erros de token e de permissão que acontecem antes de chegar no controller ficam no ErroSegurancaHandler.
// As mensagens são pra aparecer na tela: em português e dizendo o que corrigir.
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String CAMPOS_INCORRETOS = "Existem campos preenchidos de forma incorreta";

    // ----- Regras do sistema (lançadas pelos services) -----

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<ErroResponse> tratarNaoEncontrado(RecursoNaoEncontradoException ex) {
        return responder(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler({DadosInvalidosException.class, DocumentoInvalidoException.class})
    public ResponseEntity<ErroResponse> tratarDadosInvalidos(RuntimeException ex) {
        return responder(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<ErroResponse> tratarRegraNegocio(RegraNegocioException ex) {
        return responder(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(CredenciaisInvalidasException.class)
    public ResponseEntity<ErroResponse> tratarCredenciais(CredenciaisInvalidasException ex) {
        return responder(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErroResponse> tratarAutenticacao(AuthenticationException ex) {
        return responder(HttpStatus.UNAUTHORIZED, "Autenticação necessária");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErroResponse> tratarAcessoNegado(AccessDeniedException ex) {
        return responder(HttpStatus.FORBIDDEN, "Acesso não permitido");
    }

    // ----- Corpo e parâmetros da requisição -----

    // @Valid no corpo (POST/PUT) e nos filtros da listagem (@ModelAttribute): uma mensagem por campo.
    // Pega o BindException porque o MethodArgumentNotValidException é um tipo dele.
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErroResponse> tratarValidacao(BindException ex) {
        Map<String, String> campos = new LinkedHashMap<>();
        for (FieldError erro : ex.getBindingResult().getFieldErrors()) {
            // A confirmação de senha é conferida pelo método isSenhasConferem(),
            // mas o front mostra o erro embaixo do campo confirmacaoSenha
            String campo = "senhasConferem".equals(erro.getField()) ? "confirmacaoSenha" : erro.getField();
            campos.putIfAbsent(campo, mensagemDoCampo(erro));
        }
        return responder(HttpStatus.BAD_REQUEST, CAMPOS_INCORRETOS, campos);
    }

    // JSON quebrado, ou um valor que não serve pro campo (ex.: "porte": "ENORME")
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResponse> tratarCorpoInvalido(HttpMessageNotReadableException ex) {
        if (ex.getCause() instanceof InvalidFormatException formato && !formato.getPath().isEmpty()) {
            String campo = caminhoDoCampo(formato);
            String mensagem = "Valor inválido" + opcoesAceitas(formato.getTargetType());
            return responder(HttpStatus.BAD_REQUEST, CAMPOS_INCORRETOS, Map.of(campo, mensagem));
        }
        return responder(HttpStatus.BAD_REQUEST, "O corpo da requisição não é um JSON válido");
    }

    // Parâmetro da URL com valor que não existe (ex.: ?especie=PEIXE, /api/animais/nao-e-um-id)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErroResponse> tratarParametroInvalido(MethodArgumentTypeMismatchException ex) {
        return responder(HttpStatus.BAD_REQUEST,
                "Valor inválido para o parâmetro " + ex.getName() + opcoesAceitas(ex.getRequiredType()));
    }

    // Parâmetro obrigatório que não veio (ex.: GET /api/racas sem ?especie=)
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErroResponse> tratarParametroAusente(MissingServletRequestParameterException ex) {
        return responder(HttpStatus.BAD_REQUEST, "O parâmetro " + ex.getParameterName() + " é obrigatório");
    }

    // Validações nos parâmetros dos services (o AnimalService usa @Validated)
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErroResponse> tratarRestricao(ConstraintViolationException ex) {
        String mensagem = ex.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .sorted()
                .collect(Collectors.joining("; "));
        return responder(HttpStatus.BAD_REQUEST, mensagem);
    }

    // ----- Todo o resto -----

    // Erros do próprio Spring (endereço que não existe, método HTTP errado, corpo que não é JSON)
    // e qualquer coisa que ninguém previu. O detalhe técnico vai pro log do servidor, nunca pra resposta.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroResponse> tratarInesperado(Exception ex) {
        if (ex instanceof ErrorResponse erroDoSpring) {
            HttpStatus status = HttpStatus.resolve(erroDoSpring.getStatusCode().value());
            if (status != null && !status.is5xxServerError()) {
                return responder(status, mensagemDoSpring(status));
            }
        }
        log.error("Erro não tratado", ex);
        return responder(HttpStatus.INTERNAL_SERVER_ERROR,
                "Não foi possível concluir a operação. Tente de novo em instantes.");
    }

    // ----- Ajudantes -----

    private static ResponseEntity<ErroResponse> responder(HttpStatus status, String mensagem) {
        return responder(status, mensagem, null);
    }

    private static ResponseEntity<ErroResponse> responder(HttpStatus status, String mensagem,
                                                          Map<String, String> campos) {
        return ResponseEntity.status(status).body(ErroResponse.de(status, mensagem, campos));
    }

    // Quando o valor nem dá pra converter (ex.: ?porte=ENORME), o Spring manda uma mensagem
    // técnica em inglês. Aqui ela vira uma mensagem que dá pra mostrar na tela.
    private static String mensagemDoCampo(FieldError erro) {
        if (erro.contains(TypeMismatchException.class)) {
            return "Valor inválido" + opcoesAceitas(erro.unwrap(TypeMismatchException.class).getRequiredType());
        }
        return erro.getDefaultMessage();
    }

    // Se o tipo esperado é um enum, diz quais valores servem: ". Use um destes: CAO, GATO"
    private static String opcoesAceitas(Class<?> tipo) {
        if (tipo == null || !tipo.isEnum()) return "";
        return ". Use um destes: " + Arrays.stream(tipo.getEnumConstants())
                .map(Object::toString)
                .collect(Collectors.joining(", "));
    }

    // Monta o nome do campo do jeito que o front já conhece: "porte", "endereco.cep", "vacinas[0].dose"
    private static String caminhoDoCampo(JsonMappingException erro) {
        StringBuilder caminho = new StringBuilder();
        for (JsonMappingException.Reference parte : erro.getPath()) {
            if (parte.getFieldName() != null) {
                if (!caminho.isEmpty()) caminho.append('.');
                caminho.append(parte.getFieldName());
            } else {
                caminho.append('[').append(parte.getIndex()).append(']');
            }
        }
        return caminho.toString();
    }

    private static String mensagemDoSpring(HttpStatus status) {
        return switch (status) {
            case NOT_FOUND -> "Endereço não encontrado na API";
            case METHOD_NOT_ALLOWED -> "Este endereço não aceita esse método HTTP";
            case UNSUPPORTED_MEDIA_TYPE -> "Envie o corpo em JSON (Content-Type: application/json)";
            default -> "Não foi possível processar a requisição";
        };
    }
}