
const audioFiles = [
    new Audio("./black_history_battle/56.mp3"),
    new Audio("./black_history_battle/38.mp3"),
    new Audio("./black_history_battle/73.mp3"),
    new Audio("./black_history_battle/32.mp3")
];

const subtitles = [
    "きゃーっ！何それやめてええっ！",
    "うわあああっ！読むなぁぁぁ！",
    "ぎゃああああああっ！！",
    "や、やめてぇぇぇ…"
];

const toppaAudio = new Audio("./black_history_battle/67.mp3");

let gauge = 0;

function playCard(index) {
    const audio = audioFiles[index];
    const subtitle = subtitles[index];

    audio.currentTime = 0;
    audio.play();

    document.getElementById("subtitle").innerText = subtitle;

    gauge += 25;
    if (gauge > 100) gauge = 100;

    document.getElementById("bar").style.width = gauge + "%";
    document.getElementById("bar").innerText = gauge + "%";

    const charImg = document.getElementById("character");
    if (gauge === 100) {
        charImg.src = "black_history_battle/character_break-min.png";
    } else if (gauge >= 1) {
        charImg.src = "black_history_battle/character_shock-min.png";
    } else {
        charImg.src = "black_history_battle/character_normal-min.png";
    }

    if (gauge === 100) {
    	audio.pause();
	    toppaAudio.play();
        setTimeout(() => {
            alert("限界突破！もう耐えられない！");
        }, 1000);
    }
}
