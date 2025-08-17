export const getCategoryColor = (category: string): string => {
    if (category === "profile") return "#3498db";
    if (category === "preparation") return "#e74c3c";
    if (category === "education") return "#f39c12";
    if (category === "emergency") return "#e67e22";
    if (category === "location") return "#9b59b6";
    if (category === "safety") return "#27ae60";
    if (category === "community") return "#8e44ad";
    if (category === "feedback") return "#16a085";
    return "#FF5700";
  };