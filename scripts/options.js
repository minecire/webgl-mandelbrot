function toggleOrbitTrapOptions()
{
    var checked = document.getElementById("enableOrbitTrap").checked;
    document.getElementById("orbitTrapOptions").style.display = checked ? "inline" : "none";
}

function toggleZCTSlider()
{
    var checked = document.getElementById("initZCT").checked;
    document.getElementById("initZCTSlider").style.display = checked ? "inline" : "none";
}