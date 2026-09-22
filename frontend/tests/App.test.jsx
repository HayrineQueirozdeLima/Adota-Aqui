import { render, screen } from '@testing-library/react';
import App from '../src/App';

test('renderiza o titulo Adota Aqui', () => {
  render(<App />);
  expect(screen.getByText('Adota Aqui')).toBeInTheDocument();
});
