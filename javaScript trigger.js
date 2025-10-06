var player = GetPlayer();

// Load Firebase libraries
if (!window.firebase) {
  var script1 = document.createElement('script');
  script1.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
  document.head.appendChild(script1);
  
  script1.onload = function() {
    var script2 = document.createElement('script');
    script2.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js';
    document.head.appendChild(script2);
    
    script2.onload = function() {
      submitQuestion();
    };
  };
} else {
  submitQuestion();
}

function submitQuestion() {
  // Initialize Firebase
  if (!window.firebaseApp) {
    window.firebaseApp = firebase.initializeApp({
      apiKey: "AIzaSyBIek8JmAZrgW2jE21da_L3Ot403c_yrEk",
      authDomain: "formation-gds-database.firebaseapp.com",
      projectId: "formation-gds-database",
      storageBucket: "formation-gds-database.firebasestorage.app",
      messagingSenderId: "263348143098",
      appId: "1:263348143098:web:3f945e92b9f520fdaf1a43"
    });
  }
  
  var db = firebase.firestore();
  var coursePrefixes = ['lig', 'gds', 'org', 'ruc', 'sec'];
  var foundVars = [];
  
  // Scan variables
  for (var i = 0; i < coursePrefixes.length; i++) {
    for (var ch = 1; ch <= 10; ch++) {
      for (var l = 1; l <= 20; l++) {
        var varName = coursePrefixes[i] + 'cH' + ch + '_L' + l;
        try {
          var val = player.GetVar(varName);
          if (val && val.trim().length > 0) {
            foundVars.push({
              name: varName,
              value: val.trim(),
              courseId: coursePrefixes[i],
              chapter: ch,
              lesson: l
            });
          }
        } catch(e) {}
      }
    }
  }
  
  if (foundVars.length === 0) {
    alert('Please enter a question first');
    return;
  }
  
  // Get longest
  var selected = foundVars[0];
  for (var j = 1; j < foundVars.length; j++) {
    if (foundVars[j].value.length > selected.value.length) {
      selected = foundVars[j];
    }
  }
  
  // Save to Firestore
  db.collection('questions').add({
    courseId: selected.courseId,
    questionText: selected.value,
    variableUsed: selected.name,
    chapterNumber: selected.chapter,
    lessonNumber: selected.lesson,
    status: 'pending',
    dateSubmitted: new Date().toLocaleDateString('en-US'),
    timeSubmitted: new Date().toLocaleTimeString('en-US'),
    timestamp: firebase.firestore.Timestamp.now()
  }).then(function() {
    player.SetVar(selected.name, '');
    alert('Question submitted!');
  }).catch(function(error) {
    alert('Error: ' + error.message);
  });
}