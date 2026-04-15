const BASE_API_URL = 'http://localhost:8000/api';

function session_check(){
    if(!sessionStorage.getItem('csrf_token')){
        window.location.href = '../src/auth.html';

    }
}

async function logout() {
    await fetch(`${BASE_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
    });
    sessionStorage.clear();
    window.location.href = '../src/auth.html';

}

session_check();``