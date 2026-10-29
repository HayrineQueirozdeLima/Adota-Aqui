import '@testing-library/jest-dom';

// O jsdom não rola a página. Sem isso, cada troca de página nos testes avisaria
// "Not implemented: window.scrollTo" (components/RolarParaOTopo)
window.scrollTo = () => { };