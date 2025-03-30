import React from "react";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}

const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange }) => {
  return (
    <button
      onClick={() => onCheckedChange(!checked)}
      className={`w-12 h-6 flex items-center bg-gray-300 rounded-full p-1 transition ${
        checked ? "bg-blue-500" : "bg-gray-300"
      }`}
    >
      <div
        className={`h-5 w-5 bg-white rounded-full shadow-md transform transition ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      ></div>
    </button>
  );
};

export default Switch;
