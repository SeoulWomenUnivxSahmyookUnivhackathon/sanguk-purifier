document.addEventListener('DOMContentLoaded', () => {
    const navigateButtons = document.querySelectorAll('.btn-navigate');

    navigateButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 버튼에 저장된 파일명을 가져옵니다.
            const targetUrl = button.getAttribute('data-url');
            
            if (targetUrl) {
                // 브라우저의 주소창을 변경하여 새로운 페이지로 완전히 이동합니다.
                window.location.href = targetUrl;
            }
        });
    });
});