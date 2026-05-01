import { useState, useEffect, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

const DashboardPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get("/tasks");
        setTasks(res.data);
      } catch (error) {
        console.error("Error fetching tasks", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "Done").length;
  const pendingTasks = tasks.filter(
    t => t.status === "Todo" || t.status === "In Progress"
  ).length;

  return (
    <div className="container">

      {/* Header */}
      <div className="card" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
      }}>
        <h2 style={{ margin: 0 }}>Task Manager</h2>

        <div>
          <span style={{ marginRight: "15px" }}>
            {user?.name} ({user?.role})
          </span>

          <button className="btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* Title */}
      <h1 style={{ marginBottom: "20px" }}>Dashboard</h1>

      {/* Cards Row */}
      <div style={{
        display: "flex",
        gap: "20px",
        flexWrap: "wrap",
        marginBottom: "30px"
      }}>

        {/* Total Tasks */}
        <div className="card" style={{ flex: 1, minWidth: "250px" }}>
          <h3>Total Tasks</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold" }}>{totalTasks}</p>
        </div>

        {/* Completed Tasks */}
        <div className="card" style={{ flex: 1, minWidth: "250px" }}>
          <h3>Completed Tasks</h3>
          <p style={{ fontSize: "24px", color: "green", fontWeight: "bold" }}>
            {completedTasks}
          </p>
        </div>

        {/* Pending Tasks */}
        <div className="card" style={{ flex: 1, minWidth: "250px" }}>
          <h3>Pending Tasks</h3>
          <p style={{ fontSize: "24px", color: "orange", fontWeight: "bold" }}>
            {pendingTasks}
          </p>
        </div>

      </div>

      {/* Welcome Box */}
      <div className="card">
        <h2>Welcome back, {user?.name}!</h2>
        <p>You are logged in as {user?.role}.</p>
      </div>

    </div>
  );
};

export default DashboardPage;