import axios from 'axios';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import './Notifications.css';
import BackArrow from '../components/BackArrow';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Fetch notifications using useCallback to prevent unnecessary re-creation
    const fetchNotifications = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) throw new Error("Authentication required");

            const [billsResponse, notificationsResponse] = await Promise.all([
                axios.post(
                    'http://localhost:8000/api/',
                    { action: 'list_bills' },
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                axios.post(
                    'http://localhost:8000/api/',
                    { action: 'get_notifications' },
                    { headers: { Authorization: `Bearer ${token}` } }
                )
            ]);

            // Extract & format unpaid bills
            const unpaidBills = billsResponse.data.bills?.filter(bill => bill.status === 'Unpaid').map(bill => ({
                id: bill.bill_id,
                type: 'bill',
                message: `Due: ${bill.category} bill of KES ${bill.amount} by ${new Date(bill.due_date).toLocaleDateString('en-KE')}`,
                date: bill.due_date,
                isOverdue: new Date(bill.due_date) < new Date(),
                billId: bill.bill_id
            })) || [];

            // Extract & format system notifications
            const systemNotifications = notificationsResponse.data.notifications?.map(notification => ({
                id: notification.id,
                type: 'system',
                message: notification.message,
                date: notification.created_at,
                transactionId: notification.transaction_id || null,
                billId: notification.bill_id || null
            })) || [];

            // Combine and sort notifications
            const allNotifications = [...unpaidBills, ...systemNotifications].sort(
                (a, b) => new Date(b.date) - new Date(a.date)
            );

            setNotifications(allNotifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('accessToken');
                navigate('/login');
            }
            setError(error.response?.data?.error || "Failed to load notifications");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Optional: Clear notifications (for UI only, does not affect backend)
    const clearNotifications = () => setNotifications([]);

    return (
        <div className="notifications-page">
            <BackArrow onClick={() => navigate('/dashboard')} />

            <div className="notifications-container">
                <h2>Notifications</h2>

                {loading ? (
                    <div className="loading-container">
                        <CircularProgress />
                        <p>Loading notifications...</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <p>{error}</p>
                        <button onClick={fetchNotifications}>Retry</button>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="empty-state">
                        <p>No new notifications</p>
                    </div>
                ) : (
                    <>
                        <button className="clear-btn" onClick={clearNotifications}>Mark All as Read</button>
                        <ul className="notifications-list">
                            {notifications.map((notification) => (
                                <li 
                                    key={notification.id} 
                                    className={`notification-item ${notification.type} ${notification.isOverdue ? 'overdue' : ''}`}
                                >
                                    <div className="notification-content">
                                        <p className="message">{notification.message}</p>
                                        <p className="meta">
                                            <span className="date">{new Date(notification.date).toLocaleDateString('en-KE')}</span>
                                            {notification.isOverdue && (
                                                <span className="badge overdue-badge">OVERDUE</span>
                                            )}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </div>
    );
};

export default Notifications;
