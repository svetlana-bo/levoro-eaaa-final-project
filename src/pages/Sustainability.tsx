import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Sustainability = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/about#sustainability", { replace: true });
  }, [navigate]);
  return null;
};

export default Sustainability;
