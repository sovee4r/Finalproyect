function handleCredentialResponse(response) {
    // Este token se envía al servidor para verificarlo
    const responsePayload = parseJwt(response.credential);
    console.log("ID: " + responsePayload.sub);
    console.log('Email: ' + responsePayload.email);
    
    // Aquí harías un fetch() a tu PHP para iniciar sesión
}

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
}