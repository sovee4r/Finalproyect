const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");

let current = 0;

function showSlide(index){
slides.forEach(s => s.classList.remove("active"));
dots.forEach(d => d.classList.remove("active"));

slides[index].classList.add("active");
dots[index].classList.add("active");
}

dots.forEach((dot,i)=>{
dot.addEventListener("click",()=>{
current = i;
showSlide(current);
});
});

setInterval(()=>{
current = (current + 1) % slides.length;
showSlide(current);
},3000);

const menuBtn = document.getElementById("mobileMenuBtn");
const mobileMenu = document.getElementById("mobileMenu");

menuBtn.addEventListener("click",()=>{
mobileMenu.style.display =
mobileMenu.style.display === "flex" ? "none" : "flex";
});
