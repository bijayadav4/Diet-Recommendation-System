// api-service.js

class ApiService {
    constructor() {
        this.baseUrl = 'https://example.com/api'; // Replace with your actual API endpoint
    }

    async syncData(data) {
        try {
            const response = await fetch(`${this.baseUrl}/sync`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error syncing data:', error);
        }
    }

    async exportToPDF(data) {
        try {
            const response = await fetch(`${this.baseUrl}/export/pdf`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            return await response.blob();
        } catch (error) {
            console.error('Error exporting to PDF:', error);
        }
    }

    async saveData(data) {
        try {
            const response = await fetch(`${this.baseUrl}/store`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }
}

export default new ApiService();