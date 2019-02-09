// Initialize Firebase

var config = {
    apiKey: "AIzaSyBtgYxI3YHt9fOIoT3qSsYZufBzb2v-o8U",
    authDomain: "group-project-1-tracker.firebaseapp.com",
    databaseURL: "https://group-project-1-tracker.firebaseio.com",
    projectId: "group-project-1-tracker",
    storageBucket: "group-project-1-tracker.appspot.com",
    messagingSenderId: "802516410125"
};
firebase.initializeApp(config);

var database = firebase.database();
var name = "test";
var maxHealth = 25;
var currentHP = 2;
var ArmorClass = 10;
var InitiativeNumber = 10;
var monsterInitiative = 0;
var userMonsterHP = "";
var userMonsterAC = "";
var userMonsterName = "";
var dexBonus = 0;
var HPId = "";
var base = "base";
var removeId = "blank";


// Fill table with elements from the firebase
database.ref().child("Characters").on("child_added", function (snapshot) {
    $("#combat-tracker").append(
        "<tr class='transparent text-dark animated flipInX' id=" + snapshot.key + "-remove>" +
            "<td>" + snapshot.child("InitiativeNumber").val() + "</td>" +
            "<td>" + snapshot.child("name").val() + "</td>" +
            "<td id=" + snapshot.key + "-HP value=" + snapshot.child("currentHP").val() + ">" + snapshot.child("currentHP").val() + " / " + snapshot.child("maxHealth").val() + "</td>" +
            "<td>" + snapshot.child("ArmorClass").val() + "</td>" +
            "<td>" +
                "<input class='HealthInput' id=" + snapshot.key + "-HPinput" + " type='number' name='quantity' min='1' max='500'>" +
                "<button type='button' class='btn btn-success Heal' id=" + snapshot.key + " >+</button>" +
                "<button type='button' class='btn btn-danger Damage' id=" + snapshot.key + " >-</button>" +
            "</td>" +
            "<td>" +
                "<button type='button' class='btn btn-dark Remove' id=" + snapshot.key + ">Remove</button>" +
            "</td>" +
        "</tr>"    
    )
    orderCombat();
}, function (errorObject) {
    console.log("Errors handled: " + errorObject.code);
});


//  Remove combatant from firebase
database.ref().child("Characters").on("child_removed", function (snapshot) {
    event.preventDefault();
    removeId = snapshot.key;
    var removeVar = "#" + removeId + "-remove";
    $(removeVar).remove();
}, function (errorObject) {
    console.log("Errors handled: " + errorObject.code);
});


// Sorts table so highest inititiatve is on top
function orderCombat() {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("combat-table");
    switching = true;
    // make a loop that will continue until no switching has been done
    while (switching) {
        // start by saying no switching is done
        switching = false;
        rows = table.rows;
        // loop through all table rows (except the first, which contains table headers <th>)
        for (i=1; i<(rows.length-1); i++) {
            // start by saying there should be no switching
            shouldSwitch = false;
            // get the two elements as integers you want to compare, one from current row and one from the next
            x = parseInt(rows[i].cells[0].innerText);
            y = parseInt(rows[i + 1].cells[0].innerText);
            // check if the two rows should switch place
            if (x < y) {
                // if so, mark as a switch and break the loop
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            // if a switch has been marked, make the switch and mark that a switch has been done
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}


// When Add Character button is clicked
$(document).on("click", "#new-character", function () {
    name = $("#name-input").val().trim();
    maxHealth = $("#maxHealth-input").val().trim();
    currentHP = $("#currentHealth-input").val().trim();
    ArmorClass = $("#ArmorClass-input").val().trim();
    InitiativeNumber = $("#InitiativeNumber-input").val().trim();
    database.ref().child("Characters").push({
        name: name,
        maxHealth: maxHealth,
        currentHP: currentHP,
        ArmorClass: ArmorClass,
        InitiativeNumber: InitiativeNumber
    });
    $("form").trigger("reset");
});


// Remove combatant from table
$(document).on("click", ".Remove", function () {
    removeId = $(this).attr('id')
    database.ref().child("Characters").child(removeId).remove();
});


// Heal Button
$(document).on("click", ".Heal", function () {
    HPId = $(this).attr('id');
    base = HPId;
    currentHP = $("#" + HPId + '-HP').attr('value');
    currentHP = parseInt(currentHP) + parseInt($("#" + HPId + "-HPinput").val());
    $("#" + HPId + "-HPinput").val("");
    database.ref().child("Characters").child(HPId).update({
        currentHP: currentHP
    });
});


// Damage Button
$(document).on("click", ".Damage", function () {
    HPId = $(this).attr('id');
    base = HPId;
    currentHP = $("#" + HPId + '-HP').attr('value');
    currentHP = parseInt(currentHP) - parseInt($("#" + HPId + "-HPinput").val());
    $("#" + HPId + "-HPinput").val("");
    database.ref().child("Characters").child(HPId).update({
        currentHP: currentHP
    });
});


// Update HTML on damage or heal
database.ref().child("Characters").on("value", function (snapshot) {
    $("#" + base + '-HP').text(snapshot.child(base).child("currentHP").val() + "/" + snapshot.child(base).child("maxHealth").val());
    $("#" + base + '-HP').attr("value", snapshot.child(base).child("currentHP").val());
}, function (errorObject) {
    console.log("Errors handled: " + errorObject.code);
});


// When Load Monster button is clicked
$("#load-monster").on("click", function (event) {
    event.preventDefault();
    var monster = $("#user-monster").val().trim();
    var quantity = $("#how-many").val().trim();
    var upperCaseMonster = "";
    // Adds monster name to array to convert it to proper format
    var monsterWords = monster.split(" ");
    for (var i = 0; i < monsterWords.length; i++) {
        var monster = monsterWords[i];
        // Converts all letters in name to lower case
        var lowerCaseMonster = monster.toLowerCase();
        // Capitalizes the first letter of each name
        monster = lowerCaseMonster.charAt(0).toUpperCase()+lowerCaseMonster.slice(1);
        upperCaseMonster = upperCaseMonster + monster + " ";
    }
    upperCaseMonster.trim()
    var queryURL = "https://frozen-ridge-34491.herokuapp.com/api/monsters/?name="+upperCaseMonster;
    $.ajax({
        url: queryURL,   
        method: "GET",
    }).then(function(response){
        // Checks to see if ajax query comes back with result
        if (response.results.length===0){
            noSuchMonster();
        } else {
            isSuchMonster();
            var results = response.results[0].url;
            $.ajax({
                url: results, 
                method: "GET"
            }).then(function(response){
                userMonsterHP = response.hit_points;
                userMonsterAC = response.armor_class;
                userMonsterURL = "<a href='"+results+"' target='_blank'>[?]</a>";
                userMonsterName = response.name + userMonsterURL;
                userMonsterDex = response.dexterity;
                rollInitiative(userMonsterDex);
                var i;
                for (i=0; i<quantity; i++){
                    database.ref().child("Characters").push({
                        ArmorClass: userMonsterAC,
                        InitiativeNumber: monsterInitiative,
                        currentHP: userMonsterHP,
                        maxHealth: userMonsterHP,
                        name: userMonsterName,
                        URL: userMonsterURL
                    })
                }
            })
        }
    })
    $("form").trigger("reset");
})


// If ajax call comes back empty
function noSuchMonster(){
    var audio = document.createElement("audio");
    audio.setAttribute("src", "assets/sounds/error.flac");
    audio.play();
    $("#not-on-file").html("<p class='transparent p-2 animated fadeInDownBig'>Please Check Your Spelling, Otherwise This Monster Is Not In The SRD");
}


//If ajax call comes back valid
function isSuchMonster(){
    $("#not-on-file").html("");
}


// Generate Initiative For Monsters
function rollInitiative(x){
    // Roll a d20 for initiative
    var initiativeRoll = Math.floor(Math.random()*20)+1;
    // add monsters dex bonus
    if (x === 1){initiativeRoll-=5}
    else if (x > 2 && x < 4){initiativeRoll-=4}
    else if (x > 3 && x < 6){initiativeRoll-=3}
    else if (x > 5 && x < 8){initiativeRoll-=2}
    else if (x > 7 && x < 10){initiativeRoll-=1}
    else if (x > 9 && x < 12){initiativeRoll===0}
    else if (x > 11 && x < 14){initiativeRoll+=1}
    else if (x > 13 && x < 16){initiativeRoll+=2}
    else if (x > 15 && x < 18){initiativeRoll+=3}
    else if (x > 17 && x < 20){initiativeRoll+=4}
    else if (x > 19 && x < 22){initiativeRoll+=5}
    else if (x > 21 && x < 24){initiativeRoll+=6}
    else if (x > 23 && x < 26){initiativeRoll+=7}
    else if (x > 25 && x < 28){initiativeRoll+=8}
    else if (x > 27 && x < 30){initiativeRoll+=9}
    else if (x === 30){initiativeRoll+=10}
    monsterInitiative = initiativeRoll;
}

// Roll Dice
$("#roll-dice").on("click", function(event) {
    event.preventDefault();
    var audio = document.createElement("audio");
    audio.setAttribute("src", "assets/sounds/diceroll.wav");
    audio.play();
    var numberOfDice=$("#number-of-dice").val().trim();
    var numberOfSides=$("#number-of-sides").val().trim();
    var diceModifier=$("#dice-modifier").val().trim();
    var queryURL = "https://rolz.org/api/?"+numberOfDice+"d"+numberOfSides+".json";
    $.ajax({
        url: queryURL, method: "GET"
    }).then(function(response){
        var illustration = response.illustration;
        var result = response.result;
        var rolls = response.details;
        var total = parseInt(result)+parseInt(diceModifier);
        $("#dice-results").html(
            "<p>"+illustration+" + "+diceModifier+"</p>" +
            "<p>"+rolls+" + "+diceModifier+" = "+total+"</p>"
        )
    })
})
