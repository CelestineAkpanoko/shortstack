import React, { useState } from 'react'; // Import useState
import { Search, ChevronDown } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void; // Add onSearch prop
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Search for...', onSearch }) => {
  const [searchQuery, setSearchQuery] = useState(''); // State for the search input

  // Handler for input changes
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    // Optionally trigger search on type, or wait for an explicit action
    // if (onSearch) {
    //   onSearch(event.target.value);
    // }
  };

  // Handler for initiating the search (e.g., pressing Enter or clicking an icon)
  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery);
    }
    console.log("Searching for:", searchQuery); // Placeholder action
  };

  // Handler for key presses (e.g., Enter key)
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Handler for dropdown click (placeholder)
  const handleDropdownClick = () => {
    console.log("Dropdown clicked"); // Placeholder action
  };

  return (
    <div className="flex items-center bg-gray-50 border border-gray-300 rounded-full px-4 py-2 w-full max-w-md shadow-md">
      {/* Left Search Icon - can be made clickable */}
      <Search
        className="text-gray-500 w-5 h-5 mr-3 cursor-pointer"
        onClick={handleSearch} // Trigger search on icon click
      />

      {/* Input Field */}
      <input
        type="text"
        placeholder={placeholder}
        className="bg-transparent w-full outline-none text-gray-700 placeholder-gray-400"
        value={searchQuery} // Bind value to state
        onChange={handleInputChange} // Handle changes
        onKeyPress={handleKeyPress} // Handle Enter key press
      />

      {/* Right Dropdown Icon */}
      <ChevronDown
        className="text-gray-500 w-5 h-5 ml-3 cursor-pointer" // Make it clickable
        onClick={handleDropdownClick} // Handle dropdown click
      />
    </div>
  );
};

export default SearchBar; // Ensure export default is present
