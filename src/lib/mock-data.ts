import { Rider, Vehicle, Rental, Payment, Settings, Alert } from './types';

export const mockRiders: Rider[] = [
    { id: '1', fullName: 'Aarav Sharma', phone: '9876543210', email: 'aarav.sharma@example.com',  idProofType: 'Aadhaar', idProofNumber: '1234 5678 9012', documentExpiryDate: '2030-12-31', status: 'active', kycDocuments: [{ name: 'Aadhaar Card.pdf', url: '#' }], rentalsCount: 5, totalSpent: 25000 },
    { id: '2', fullName: 'Diya Patel', phone: '9876543211', email: 'diya.patel@example.com', idProofType: 'Passport', idProofNumber: 'Z1234567', documentExpiryDate: '2028-05-20', status: 'active', kycDocuments: [], rentalsCount: 2, totalSpent: 12000 },
    { id: '3', fullName: 'Rohan Mehta', phone: '9876543212', email: 'rohan.mehta@example.com', idProofType: 'DL', idProofNumber: 'DL0120200001234', documentExpiryDate: '2024-08-15', status: 'blocked', kycDocuments: [{ name: 'Driving License.jpg', url: '#' }], rentalsCount: 1, totalSpent: 3500 },
];

export const mockVehicles: Vehicle[] = [
    { id: 'v1', code: 'ZG-001', brand: 'Ola', name: 'S1 Pro', color: 'Midnight Blue', registrationNumber: 'MH01AB1234', batteryHealth: 98, lastServiceDate: '2024-05-01', available: true, isServiceDue: false },
    { id: 'v2', code: 'ZG-002', brand: 'Ather', name: '450X', color: 'Space Grey', registrationNumber: 'DL02CD5678', batteryHealth: 92, lastServiceDate: '2024-03-15', available: false, isServiceDue: false },
    { id: 'v3', code: 'ZG-003', brand: 'TVS', name: 'iQube', color: 'Pearl White', registrationNumber: 'KA03EF9012', batteryHealth: 85, lastServiceDate: '2023-12-20', available: true, isServiceDue: true },
];

export const mockRentals: Rental[] = [
    { id: 'r1', riderId: '1', vehicleId: 'v2', plan: 'weekly', startDate: '2024-07-20T09:00:00.000Z', expectedReturnDate: '2024-07-27T09:00:00.000Z', actualReturnDate: null, status: 'ongoing', payableTotal: 7000, paidTotal: 5000, balanceDue: 2000, rider: mockRiders[0], vehicle: mockVehicles[1] },
    { id: 'r2', riderId: '2', vehicleId: 'v1', plan: 'daily', startDate: '2024-07-24T14:00:00.000Z', expectedReturnDate: '2024-07-25T14:00:00.000Z', actualReturnDate: '2024-07-25T14:05:00.000Z', status: 'completed', payableTotal: 1200, paidTotal: 1200, balanceDue: 0, rider: mockRiders[1], vehicle: mockVehicles[0] },
    { id: 'r3', riderId: '1', vehicleId: 'v3', plan: 'weekly', startDate: '2024-07-10T10:00:00.000Z', expectedReturnDate: '2024-07-17T10:00:00.000Z', actualReturnDate: null, status: 'overdue', payableTotal: 7000, paidTotal: 7000, balanceDue: 0, rider: mockRiders[0], vehicle: mockVehicles[2] },
];

export const mockPayments: Payment[] = [
    { id: 'p1', rentalId: 'r1', riderId: '1', amount: 5000, method: 'upi', transactionDate: '2024-07-20T09:05:00.000Z', txnRef: 'UPI12345', rider: mockRiders[0], rental: mockRentals[0] },
    { id: 'p2', rentalId: 'r2', riderId: '2', amount: 1200, method: 'card', transactionDate: '2024-07-24T14:02:00.000Z', rider: mockRiders[1], rental: mockRentals[1] },
    { id: 'p3', rentalId: 'r3', riderId: '1', amount: 7000, method: 'online', transactionDate: '2024-07-10T10:03:00.000Z', rider: mockRiders[0], rental: mockRentals[2] },
];

export const mockAlerts: Alert[] = [
    { id: 'a1', type: 'Payment Due', message: 'Payment of ₹2000 due for Rental #r1', relatedId: 'r1', dueDate: '2024-07-27', status: 'unread' },
    { id: 'a2', type: 'Overdue Rental', message: 'Rental #r3 is overdue since 2024-07-17', relatedId: 'r3', dueDate: '2024-07-17', status: 'read' },
    { id: 'a3', type: 'Document Expiry', message: 'Rohan Mehta\'s DL is expiring soon.', relatedId: '3', dueDate: '2024-08-15', status: 'unread' },
];

// export const mockStaff: Staff[] = [
//     { id: 's1', email: 'admin@zapgo.com', displayName: 'Super Admin', role: 'ADMIN', lastLogin: '2024-07-25T10:00:00.000Z', status: 'active' },
//     { id: 's2', email: 'staff@zapgo.com', displayName: 'Rajesh Kumar', role: 'STAFF', lastLogin: '2024-07-25T09:30:00.000Z', status: 'active' },
//     { id: 's3', email: 'inactive.staff@zapgo.com', displayName: 'Priya Singh', role: 'STAFF', lastLogin: '2024-06-25T12:00:00.000Z', status: 'disabled' },
// ];

export const mockSettings: Settings = {
    companyName: 'ZapGo Rentals Pvt. Ltd.',
    currency: 'INR',
    graceDays: 2,
    dailyRateDefault: 1200,
    weeklyRateDefault: 7000,
    lateFeeEnabled: true,
    lateFeePerDay: 500,
};
