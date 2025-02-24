import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home-container">
      <h1>Welcome to FinanceTracker</h1>
      <p>Manage your bills with ease.</p>
      <Link to="/register">
        <button className="get-started-btn">Get Started</button>
      </Link>
    </div>
  );
}

export default Home;
