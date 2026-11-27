import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// RELLENO: Eli lo reemplaza con la vista real
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleEnter = async () => {
    await login();
    navigate('/profile');
  };

  return (
    <main>
      <h1>Login (pendiente: Eli)</h1>
      <button onClick={handleEnter}>Entrar (falso)</button>
    </main>
  );
}