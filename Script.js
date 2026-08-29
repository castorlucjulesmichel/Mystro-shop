const bouton = document.getElementById("monBouton");
const message = document.getElementById("message");

bouton.addEventListener("click", function () {
    message.textContent = "Bravo ! 🎉 Ton JavaScript fonctionne !";
});