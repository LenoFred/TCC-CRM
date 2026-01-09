import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<'Admin' | 'Staff'>('Admin');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load Google Jost font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Jost:wght@500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent, type: 'Admin' | 'Staff') => {
    e.preventDefault();
    setIsLoading(true);
    setLoginType(type);

    try {
      const result = await login(username, password, type);
      
      if (result.success) {
        toast({
          title: 'Login Successful',
          description: `Welcome back!`,
        });
        navigate('/');
      } else {
        // Show specific error message from backend
        toast({
          title: 'Authentication Error',
          description: result.error || 'Invalid credentials. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check your connection.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        body {
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-family: 'Jost', sans-serif;
          background: url("/church-background.jpg") no-repeat center/cover;
          background-attachment: fixed;
        }
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 12, 41, 0.75);
          z-index: -1;
        }
        .main {
          width: 350px;
          height: 500px;
          background: red;
          overflow: hidden;
          background: url("https://doc-08-2c-docs.googleusercontent.com/docs/securesc/68c90smiglihng9534mvqmq1946dmis5/fo0picsp1nhiucmc0l25s29respgpr4j/1631524275000/03522360960922298374/03522360960922298374/1Sx0jhdpEpnNIydS4rnN4kHSJtU1EyWka?e=view&authuser=0&nonce=gcrocepgbb17m&user=03522360960922298374&hash=tfhgbs86ka6divo3llbvp93mg4csvb38") no-repeat center/cover;
          border-radius: 10px;
          box-shadow: 5px 20px 50px #000;
          position: relative;
        }
        .main::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 10px;
          z-index: 1;
        }
        .main > input,
        .main > .signup,
        .main > .login {
          position: relative;
          z-index: 2;
        }
        #chk {
          display: none;
        }
        .signup {
          position: relative;
          width: 100%;
          height: 100%;
        }
        label {
          color: #fff;
          font-size: 2.3em;
          justify-content: center;
          display: flex;
          align-items: center;
          margin: 60px 60px 40px 60px;
          font-weight: bold;
          cursor: pointer;
          transition: .5s ease-in-out;
          position: relative;
          white-space: nowrap;
        }
        label .arrow {
          margin-left: 15px;
          font-size: 1em;
          display: inline-block;
          font-weight: 650;
          line-height: 1;
        }
        .signup label .arrow {
          display: none;
        }
        .login label .arrow {
          animation: bounceUp 1.5s ease-in-out infinite;
        }
        @keyframes bounceUp {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes bounceDown {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(8px);
          }
        }
        #chk:checked ~ .signup label .arrow {
          display: inline-block;
          animation: bounceDown 1.5s ease-in-out infinite;
        }
        #chk:checked ~ .login label .arrow {
          display: none;
        }
        input {
          width: 75%;
          height: 38px;
          background: #e0dede;
          justify-content: center;
          display: flex;
          margin: 20px auto;
          padding: 16px;
          border: none;
          outline: none;
          border-radius: 5px;
          font-size: 1em;
        }
        button {
          width: 75%;
          height: 54px;
          margin: 10px auto;
          justify-content: center;
          display: block;
          color: #fff;
          background: #573b8a;
          font-size: 1.05em;
          font-weight: bold;
          margin-top: 20px;
          outline: none;
          border: none;
          border-radius: 5px;
          transition: .2s ease-in;
          cursor: pointer;
        }
        button:hover {
          background: #6d44b8;
        }
        .help-text {
          text-align: center;
          margin-top: 20px;
          font-size: 0.75em;
          color: #666;
          line-height: 1.6;
        }
        .help-text a {
          color: #573b8a;
          text-decoration: none;
          font-weight: 600;
        }
        .help-text a:hover {
          text-decoration: underline;
        }
        .help-text .copyright {
          font-size: 0.9em;
          margin-top: 8px;
          opacity: 0.8;
        }
        .login {
          height: 460px;
          background: #eee;
          border-radius: 60% / 10%;
          transform: translateY(-180px);
          transition: .8s ease-in-out;
        }
        .login label {
          color: #573b8a;
          transform: scale(.6);
        }
        #chk:checked ~ .login {
          transform: translateY(-500px);
        }
        #chk:checked ~ .login label {
          transform: scale(1);
        }
        #chk:checked ~ .signup label {
          transform: scale(.6);
        }
      `}</style>

      <div className="main">
        <input type="checkbox" id="chk" aria-hidden="true" />

        <div className="signup">
          <form onSubmit={(e) => handleSubmit(e, 'Admin')}>
            <label htmlFor="chk" aria-hidden="true">
              Admin Login
              <span className="arrow">↓</span>
            </label>
            <input 
              type="text" 
              name="txt" 
              placeholder="Username" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
            <input 
              type="password" 
              name="pswd" 
              placeholder="Password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </button>
            <div className="help-text">
              <p>
                Need help accessing your account?<br />
                <a href="https://wa.me/2348067541243" target="_blank" rel="noopener noreferrer">
                  Contact IT Support
                </a>
              </p>
              <p className="copyright">© 2026 TCC. All rights reserved.</p>
            </div>
          </form>
        </div>

        <div className="login">
          <form onSubmit={(e) => handleSubmit(e, 'Staff')}>
            <label htmlFor="chk" aria-hidden="true">
              Staff Login
              <span className="arrow">↑</span>
            </label>
            <input 
              type="text" 
              name="txt" 
              placeholder="Username" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
            <input 
              type="password" 
              name="pswd" 
              placeholder="Password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </button>
            <div className="help-text">
              <p>
                Need help accessing your account?<br />
                <a href="https://wa.me/2348067541243" target="_blank" rel="noopener noreferrer">
                  Contact IT Support
                </a>
              </p>
              <p className="copyright">© 2026 TCC. All rights reserved.</p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}