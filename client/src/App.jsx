import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { RoomProvider } from './context/RoomContext';
import HomePage from './pages/HomePage';
import HostPage from './pages/HostPage';
import ControllerPage from './pages/ControllerPage';

function App() {
  return (
    <SocketProvider>
      <RoomProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/host/:roomCode" element={<HostPage />} />
            <Route path="/controller/:roomCode" element={<ControllerPage />} />
          </Routes>
        </Router>
      </RoomProvider>
    </SocketProvider>
  );
}

export default App;
