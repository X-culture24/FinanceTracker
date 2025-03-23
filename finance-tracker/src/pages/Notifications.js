import axios from 'axios';
import React, { useEffect, useState } from 'react';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch unpaid bills as notifications
    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('accessToken'); // Ensure correct token key
            if (!token) {
                console.error("No access token found.");
                return;
            }

            // Call the correct URL
            const response = await axios.post(
                'http://localhost:8000/api/',
                { action: 'list_bills' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('API Response:', response.data); // Debugging output

            // Get only unpaid bills for notifications
            const unpaidBills = response.data.bills.filter(bill => bill.status === 'Unpaid');
            const formattedNotifications = unpaidBills.map(bill => ({
                id: bill.bill_id,
                message: `Reminder: Pay ${bill.category || 'Unknown'} bill of KES ${bill.amount} by ${bill.due_date || 'No due date'}.`,
            }));

            setNotifications(formattedNotifications);
        } catch (error) {
            console.error('Error fetching notifications:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <div className="notifications-container">
            <h2>Notifications</h2>
            {loading ? (
                <p>Loading notifications...</p>
            ) : notifications.length === 0 ? (
                <p>No pending notifications.</p>
            ) : (
                <ul>
                    {notifications.map((notification) => (
                        <li key={notification.id}>{notification.message}</li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Notifications;
