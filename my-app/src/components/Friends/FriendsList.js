import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { makeAuthenticatedGETRequest } from '../../utils/serverHelpers';
import { useSocket } from '../../contexts/socketContext';
import FriendCard from './FriendCard';
import SearchUsers from './SearchUsers';

const FriendsList = () => {
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const { socket } = useSocket();

    useEffect(() => {
        fetchFriends();
        fetchPendingRequests();
    }, []);

    useEffect(() => {
        if (!socket) return;

        // Listen for friend online/offline status changes
        socket.on('friendOnline', ({ userId }) => {
            setFriends(prev => prev.map(friend => 
                friend._id === userId ? { ...friend, isOnline: true } : friend
            ));
        });

        socket.on('friendOffline', ({ userId, lastSeen }) => {
            setFriends(prev => prev.map(friend => 
                friend._id === userId ? { ...friend, isOnline: false, lastSeen } : friend
            ));
        });

        socket.on('friendCurrentlyPlaying', ({ userId, songId, timestamp }) => {
            setFriends(prev => prev.map(friend => 
                friend._id === userId ? { ...friend, currentlyPlaying: { song: songId, timestamp } } : friend
            ));
        });

        return () => {
            socket.off('friendOnline');
            socket.off('friendOffline');
            socket.off('friendCurrentlyPlaying');
        };
    }, [socket]);

    const fetchFriends = async () => {
        try {
            setIsLoading(true);
            const response = await makeAuthenticatedGETRequest('/friends/list');
            if (response.error) {
                throw new Error(response.error);
            }
            setFriends(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const response = await makeAuthenticatedGETRequest('/friends/requests');
            if (response.error) {
                throw new Error(response.error);
            }
            setPendingRequests(response.data);
        } catch (err) {
            console.error('Error fetching requests:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="animate-pulse">
                    <div className="h-10 bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-500 bg-red-500/10 rounded">
                {error}
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Friends</h2>
                <button
                    onClick={() => setShowSearch(true)}
                    className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-400 transition-colors flex items-center space-x-2"
                >
                    <Icon icon="material-symbols:person-add" />
                    <span>Add Friend</span>
                </button>
            </div>

            {pendingRequests.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Pending Requests</h3>
                    <div className="space-y-2">
                        {pendingRequests.map(request => (
                            <FriendCard
                                key={request._id}
                                friend={request.sender}
                                isPending={true}
                                onAccept={() => {/* Handle accept */}}
                                onDecline={() => {/* Handle decline */}}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {friends.map(friend => (
                    <FriendCard
                        key={friend._id}
                        friend={friend}
                        isPending={false}
                    />
                ))}
            </div>

            {showSearch && (
                <SearchUsers
                    onClose={() => setShowSearch(false)}
                    onSendRequest={async () => {
                        await fetchFriends();
                        setShowSearch(false);
                    }}
                />
            )}
        </div>
    );
};

export default FriendsList; 