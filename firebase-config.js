/* =========================================================================
   firebase-config.js
   -------------------------------------------------------------------------
   Currently EMPTY on purpose - the site works right now using this
   browser's localStorage. Once you paste your real config below, every
   save is ALSO copied to your Firestore database automatically (see
   script.js, Part 1). Nothing else changes or breaks either way.

   IMPORTANT - "Authentication" vs "Firestore Database":
   In the Firebase console sidebar these are two SEPARATE products.
   - "Firestore Database" is the actual database - this is the one you
     need, and the one this site uses. Your saved data appears under
     Firestore Database > Data, NOT under Authentication.
   - "Authentication" is an optional extra for real password-protected
     user accounts. This site's Login page only collects a name, grade,
     and level (no password), so you do NOT need Authentication turned
     on for saving to work. If you looked under Authentication and saw
     no data, that's expected - check Firestore Database > Data instead.

   STEP-BY-STEP SETUP:
   1. Go to console.firebase.google.com and open (or create) your project.
   2. In the left sidebar: Build > Firestore Database > Create database
      > choose a location > start in "Test mode".
   3. In the left sidebar: Project settings (gear icon) > scroll to
      "Your apps" > click the "</>" (web) icon > give it any nickname >
      Register app. Firebase will show you a "firebaseConfig" object.
   4. Copy that whole object and paste it below, replacing the empty {}.
   5. In every .html file's <head>, just ABOVE the <script src="script.js">
      line, these three lines should already be present (I added them):
        <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
        <script src="firebase-config.js"></script>
      If they are missing from a page, copy them from another page.
   6. Save this file, reload the site, log in, and take a test. Then check
      your Firebase console: Firestore Database > Data - you should see a
      "users" collection and an "attempts" collection appear.

   That's it - no other code changes are needed for saving to start
   working. (Reading saved history back from Firestore, e.g. on a
   different device, is a separate follow-up step - just ask.)
   ========================================================================= */

/* =========================================================================
   firebase-config.js
   ========================================================================= */

var firebaseConfig = {
    apiKey: "AIzaSyAZcoGuo6FsFHOZuiZ9vlir-zKGXvdSb9c",
    authDomain: "majestic-math-tutor-project.firebaseapp.com",
    projectId: "majestic-math-tutor-project",
    storageBucket: "majestic-math-tutor-project.firebasestorage.app",
    messagingSenderId: "13136405116",
    appId: "1:13136405116:web:38aec90f6d3cd3d0725ff9",
    measurementId: "G-05SW7W5SPT"
};

/* NOTE: firebase.initializeApp(firebaseConfig) is intentionally NOT called
   here. script.js's setUpFirebaseIfConfigured() does that one time, using
   the firebaseConfig object defined above. Calling initializeApp() a
   second time here used to throw "Firebase App named '[DEFAULT]' already
   exists", which stopped script.js from running on every page. */

