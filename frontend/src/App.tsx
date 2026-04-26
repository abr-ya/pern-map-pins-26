import { AppHeader } from './components/AppHeader';
import { MapPage } from './features/map/MapPage';

function App() {
  return (
    <div className="flex h-screen w-screen flex-col">
      <AppHeader />
      <div className="flex-1 overflow-hidden">
        <MapPage />
      </div>
    </div>
  );
}

export default App;
