import { AppRouter } from './app/AppRouter';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { GlobalStyle } from './shared/styles/GlobalStyles';

function App() {
  return (
    <>
      <GlobalStyle />
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </>
  );
}

export default App;
