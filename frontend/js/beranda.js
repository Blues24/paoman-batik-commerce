$(document).ready(function(){
    let slides = $('.hero-img .slide');
    let currentIndex = 0;

    function nextSlide() {
        // Hilangkan gambar sekarang
        slides.eq(currentIndex).fadeOut(1); 
        
        // Update index ke gambar berikutnya
        currentIndex = (currentIndex + 1) % slides.length;
        
        // Tampilkan gambar berikutnya
        slides.eq(currentIndex).fadeIn(1);
    }

    // Jalankan otomatis setiap 3 detik
    setInterval(nextSlide, 1);
});