// Derived from the page's own host so the app works whether it's opened via
// localhost, a LAN IP, or a public IP/domain — hardcoding "localhost" here
// breaks CORS/PNA when the frontend is served from a different machine.
export const BACKEND_ORIGIN = `${window.location.protocol}//${window.location.hostname}:5001`;
