console.log("🏥 Hospital Token Queue System Started");

// Queue to store patients
let patientQueue = [];
let tokenNo = 100;

// Patient arrives
function addPatient(name, issue) {
  let patient = {
    token: tokenNo++,
    name: name,
    issue: issue,
    status: "Waiting"
  };

  patientQueue.push(patient);
  console.log(`➡️ Patient ${name} registered | Token ${patient.token}`);
  showQueue();
}

// Doctor attends patient
function attendPatient() {
  if (patientQueue.length === 0) {
    console.log("😴 No patients waiting");
    return;
  }

  let patient = patientQueue.shift();
  patient.status = "Consulting";
  console.log(`👨‍⚕️ Doctor attending ${patient.name} (Token ${patient.token})`);
  showQueue();
}

// Display queue
function showQueue() {
  console.log("📋 Current Patient Queue:");

  if (patientQueue.length === 0) {
    console.log("Queue Empty\n");
    return;
  }

  patientQueue.forEach((p, index) => {
    console.log(
      `${index + 1}. Token ${p.token} | ${p.name} | ${p.issue} | ${p.status}`
    );
  });
  console.log("");
}

// Simulation flow
addPatient("Ravi", "Fever");
addPatient("Anita", "Headache");
addPatient("Kiran", "Back Pain");
attendPatient();
addPatient("Zoya", "Cold");
attendPatient();
attendPatient();
addPatient("Manoj", "Checkup");
