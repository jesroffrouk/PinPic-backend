const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY

const locationServices = {
    getLocationName: async(location) => {
        // make an api call to third party api geocoding
        // handle response and return it.
        const request = await fetch(`http://api.openweathermap.org/geo/1.0/reverse?lat=${location.latitude}&lon=${location.longitude}&limit=1&appid=${GEOCODING_API_KEY}`)
        const response = await request.json()
        return response[0]
    }
}

export default locationServices
