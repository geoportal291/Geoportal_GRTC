import React from "react";

// #region Custom Components
/* eslint-disable no-unused-vars */
export const Button = ({ children, variant = "primary", size = "md", onClick, className = "", ...props }) => {
    const baseClasses = "font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2",
        lg: "px-6 py-3 text-lg"
    };
    const variantClasses = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
        outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
        ghost: "text-gray-700 hover:bg-gray-100 focus:ring-blue-500",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
    };

    return (
        <button
            className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

export const Input = ({ className = "", ...props }) => {
    return (
        <input
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
            {...props}
        />
    );
};

export const Select = ({ children, value, onChange, onValueChange, className = "", ...props }) => {
    const handleChange = onChange || ((e) => onValueChange(e.target.value));
    return (
        <select
            value={value}
            onChange={handleChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
            {...props}
        >
            {children}
        </select>
    );
};

export const Label = ({ children, className = "", ...props }) => {
    return (
        <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`} {...props}>
            {children}
        </label>
    );
};

export const Textarea = ({ className = "", ...props }) => {
    return (
        <textarea
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
            {...props}
        />
    );
};

export const Badge = ({ children, className = "", ...props }) => {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};

export const Table = ({ children, className = "", ...props }) => {
    return (
        <table className={`min-w-full divide-y divide-gray-200 ${className}`} {...props}>
            {children}
        </table>
    );
};

export const TableHeader = ({ children, className = "", ...props }) => {
    return (
        <thead className={`bg-gray-50 ${className}`} {...props}>
            {children}
        </thead>
    );
};

export const TableBody = ({ children, className = "", ...props }) => {
    return (
        <tbody className={`bg-white divide-y divide-gray-200 ${className}`} {...props}>
            {children}
        </tbody>
    );
};

export const TableRow = ({ children, className = "", ...props }) => {
    return (
        <tr className={className} {...props}>
            {children}
        </tr>
    );
};

export const TableHead = ({ children, className = "", ...props }) => {
    return (
        <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`} {...props}>
            {children}
        </th>
    );
};

export const TableCell = ({ children, className = "", ...props }) => {
    return (
        <td className={`px-6 py-4 whitespace-nowrap ${className}`} {...props}>
            {children}
        </td>
    );
};

export const Dialog = ({ open, onOpenChange, children }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => onOpenChange(false)}></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                {children}
            </div>
        </div>
    );
};

export const DialogContent = ({ children, className = "", ...props }) => {
    return (
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${className}`} {...props}>
            {children}
        </div>
    );
};

export const DialogHeader = ({ children, className = "", ...props }) => {
    return (
        <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${className}`} {...props}>
            {children}
        </div>
    );
};

export const DialogTitle = ({ children, className = "", ...props }) => {
    return (
        <h3 className={`text-lg leading-6 font-medium text-gray-900 ${className}`} {...props}>
            {children}
        </h3>
    );
};

export const DialogFooter = ({ children, className = "", ...props }) => {
    return (
        <div className={`bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${className}`} {...props}>
            {children}
        </div>
    );
};

export const Card = ({ children, className = "", ...props }) => {
    return (
        <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`} {...props}>
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = "", ...props }) => {
    return (
        <div className={`px-4 py-5 sm:px-6 border-b border-gray-200 ${className}`} {...props}>
            {children}
        </div>
    );
};

export const CardTitle = ({ children, className = "", ...props }) => {
    return (
        <h3 className={`text-lg leading-6 font-medium text-gray-900 ${className}`} {...props}>
            {children}
        </h3>
    );
};

export const CardContent = ({ children, className = "", ...props }) => {
    return (
        <div className={`px-4 py-5 sm:p-6 ${className}`} {...props}>
            {children}
        </div>
    );
};
/* eslint-enable no-unused-vars */
// #endregion
