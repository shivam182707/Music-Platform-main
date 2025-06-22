import React from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { makeAuthenticatedPOSTRequest } from '../../utils/serverHelpers';

const FriendCard = ({ friend, isPending, onAccept, onDecline }) => {
    const navigate = useNavigate();

    const handleAccept = async () => {
        try {
            const response = await makeAuthenticatedPOSTRequest(`/friends/request/${friend._id}/accept`, {});
            if (response.error) {
                throw new Error(response.error);
            }
            onAccept();
        } catch (error) {
            console.error('Error accepting request:', error);
        }
    };

    const handleDecline = async () => {
        try {
            const response = await makeAuthenticatedPOSTRequest(`/friends/request/${friend._id}/decline`, {});
            if (response.error) {
                throw new Error(response.error);
            }
            onDecline();
        } catch (error) {
            console.error('Error declining request:', error);
        }
    };

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-between hover:bg-gray-800 transition-colors">
            <div className="flex items-center space-x-4">
                <img
                    src={friend.profilePicture}
                    alt={friend.username}
                    className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                    <h3 className="text-white font-semibold">
                        {friend.firstName} {friend.lastName}
                        <span className="text-sm text-gray-400 ml-2">@{friend.username}</span>
                    </h3>
                    {!isPending && (
                        <div className="text-sm">
                            {friend.isOnline ? (
                                <span className="text-green-500 flex items-center">
                                    <Icon icon="mdi:circle" className="mr-1" />
                                    Online
                                </span>
                            ) : (
                                <span className="text-gray-400">
                                    Last seen {getTimeAgo(friend.lastSeen)}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center space-x-2">
                {isPending ? (
                    <>
                        <button
                            onClick={handleAccept}
                            className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-400 transition-colors"
                        >
                            Accept
                        </button>
                        <button
                            onClick={handleDecline}
                            className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-400 transition-colors"
                        >
                            Decline
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => navigate(`/chat/${friend._id}`)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-400 transition-colors flex items-center space-x-2"
                    >
                        <Icon icon="mdi:chat" />
                        <span>Message</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default FriendCard; 