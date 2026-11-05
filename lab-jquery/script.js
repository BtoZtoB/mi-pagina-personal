let clics = 0;

const contador = document.getElementById("contador");
const sumarBtn = document.getElementById("sumarBtn");
const reiniciarBtn = document.getElementById("reiniciarBtn");

sumarBtn.addEventListener("click", function() {
    clics++;
    contador.textContent = clics;
});

reiniciarBtn.addEventListener("click", function() {
    clics = 0;
    contador.textContent = clics;
});
