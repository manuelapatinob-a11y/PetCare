document.querySelectorAll('.btn').forEach(b=>b.addEventListener('mouseenter',()=>b.style.transform='translateY(-2px)'));
document.querySelectorAll('.btn').forEach(b=>b.addEventListener('mouseleave',()=>b.style.transform=''));

const counters=document.querySelectorAll(".counter");

counters.forEach(counter=>{

const update=()=>{

const target=+counter.getAttribute("data-target");

const count=+counter.innerText;

const increment=target/100;

if(count<target){

counter.innerText=Math.ceil(count+increment);

setTimeout(update,20);

}else{
counter.innerText=target+"+";
}

}
update();
});

const carousel = new bootstrap.Carousel('#testimonialCarousel', {
    interval: 4000,
    pause: 'hover',
    ride: 'carousel'
});

const carouse = new bootstrap.Carousel('#testimonialCarousel', {
    interval: 4000,
    pause: 'hover',
    ride: 'carousel'
});