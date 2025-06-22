import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { makeAuthenticatedGETRequest, makeAuthenticatedPOSTRequest } from '../../utils/serverHelpers';

const SearchUsers = ({ onClose, onSendRequest }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            setIsLoading(true);
            setError(null);
            const response = await makeAuthenticatedGETRequest(`/friends/search/${searchQuery}`);
            if (response.error) {
                throw new Error(response.error);
            }
            setSearchResults(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendRequest = async (userId) => {
        try {
            const response = await makeAuthenticatedPOSTRequest('/friends/request', {
                receiverId: userId
            });
            if (response.error) {
                throw new Error(response.error);
            }
            onSendRequest();
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Add Friends</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <Icon icon="mdi:close" className="text-2xl" />
                    </button>
                </div>

                <form onSubmit={handleSearch} className="mb-6">
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by username or name..."
                            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                            type="submit"
                            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-400 transition-colors flex items-center space-x-2"
                            disabled={isLoading}
                        >
                            <Icon icon="mdi:search" />
                            <span>Search</span>
                        </button>
                    </div>
                </form>

                {isLoading ? (
                    <div className="animate-pulse space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={`skeleton-${i}`} className="h-16 bg-gray-800 rounded-lg"></div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-red-500 bg-red-500/10 p-4 rounded-lg">
                        {error}
                    </div>
                ) : searchResults.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {searchResults.map(user => (
                            <div
                                key={user._id}
                                className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={user.profilePicture}
                                        alt={user.username}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <h3 className="text-white font-semibold">
                                            {user.firstName} {user.lastName}
                                            <span className="text-sm text-gray-400 ml-2">@{user.username}</span>
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSendRequest(user._id)}
                                    className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-400 transition-colors"
                                >
                                    Add Friend
                                </button>
                            </div>
                        ))}
                    </div>
                ) : searchQuery && (
                    <div className="text-center text-gray-400 py-8">
                        No users found matching "{searchQuery}"
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchUsers;
