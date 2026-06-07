#include <PubSubClient.h>
#include <WiFi.h>
#include <ESP32Servo.h>

// ==========================================
// CONFIGURATION À MODIFIER AVEC TES INFOS
// ==========================================
#include "secrets.h"

const char *ssid = SECRET_SSID;
const char *password = SECRET_PASS;

// --- Configuration MQTT ---
const char *mqtt_server = "broker.emqx.io";
const int mqtt_port = 1883;

// --- Configuration Capteurs ---
const int NUM_CAPTEURS = 4;
const int capteurPins[NUM_CAPTEURS] = {14, 15, 16, 17};
const char *mqtt_topics[NUM_CAPTEURS] = {
  "parkwize/place1", // A1
  "parkwize/place2", // A2
  "parkwize/place3", // A3
  "parkwize/place4"  // A4
};
int derniersEtats[NUM_CAPTEURS] = {-1, -1, -1, -1}; // Permet de n'envoyer un message que quand l'état change

// --- Configuration Barrière (Radar & Servo) ---
const int trigPin = 32; 
const int echoPin = 35;
const int servoPin = 26;

Servo barriereServo;
bool barriereOuverte = false;
unsigned long tempsOuverture = 0;

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connexion à ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  // Attente de la connexion WiFi
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connecté !");
  Serial.print("Adresse IP : ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  // Boucle jusqu'à ce qu'on soit connecté au broker MQTT
  while (!client.connected()) {
    Serial.print("Tentative de connexion MQTT...");

    // Création d'un ID client aléatoire pour l'ESP32
    String clientId = "ESP32_ParkWize_";
    clientId += String(random(0xffff), HEX);

    // Tentative de connexion avec Last Will and Testament (LWT)
    if (client.connect(clientId.c_str(), "parkwize/status", 1, true, "offline")) {
      Serial.println(" Connecté au Broker HiveMQ !");

      // Signaler que l'ESP est en ligne
      client.publish("parkwize/status", "online", true);

      // Forcer l'envoi de l'état de tous les capteurs à la prochaine boucle
      for (int i = 0; i < NUM_CAPTEURS; i++) {
        derniersEtats[i] = -1;
      }
    } else {
      Serial.print(" Échec, rc=");
      Serial.print(client.state());
      Serial.println(" (nouvelle tentative dans 5 secondes)");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  // Initialisation des pins pour les 4 capteurs
  for (int i = 0; i < NUM_CAPTEURS; i++) {
    pinMode(capteurPins[i], INPUT_PULLUP);
  }

  // Initialisation du radar et du servo
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  
  // Configuration spécifique pour éviter que le servo ne vibre sur ESP32
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  barriereServo.setPeriodHertz(50); // Fréquence standard pour un servomoteur (50Hz)
  barriereServo.attach(servoPin, 500, 2400); // Valeurs min/max pour les petits servos (ex: SG90)
  
  barriereServo.write(0); // Barrière fermée par défaut

  setup_wifi();                             // Connexion au WiFi
  client.setServer(mqtt_server, mqtt_port); // Configuration du broker
}

void loop() {
  // S'assurer qu'on est toujours connecté au MQTT
  if (!client.connected()) {
    reconnect();
  }
  client.loop(); // Essentiel pour maintenir la connexion active en arrière-plan

  int placesLibres = 0; // Compteur de places libres

  // Lecture et envoi de l'état de chaque capteur
  for (int i = 0; i < NUM_CAPTEURS; i++) {
    int etatActuel = digitalRead(capteurPins[i]);

    if (etatActuel == HIGH) { // On considère que HIGH = place libre
      placesLibres++;
    }

    // On envoie la donnée MQTT SEULEMENT si l'état change
    if (etatActuel != derniersEtats[i]) {
      if (etatActuel == LOW) {
        Serial.print("🚗 Voiture détectée sur le Spot ");
        Serial.print(i + 1);
        Serial.println(" (A" + String(i + 1) + ") ! Envoi : Occupee");
        client.publish(mqtt_topics[i], "Occupee", true);
      } else {
        Serial.print("✅ Spot ");
        Serial.print(i + 1);
        Serial.println(" (A" + String(i + 1) + ") libéré. Envoi : Libre");
        client.publish(mqtt_topics[i], "Libre", true);
      }

      // On met à jour l'ancien état pour ce capteur
      derniersEtats[i] = etatActuel;
    }
  }

  // --- Gestion du radar et de la barrière ---
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  long distance = (duration / 2) * 0.0343;

  // Si une voiture est devant la barrière (distance < 15 cm) et que la barrière est fermée
  if (!barriereOuverte && distance > 0 && distance < 15) {
    if (placesLibres > 0) {
      Serial.println("🚗 Voiture détectée à l'entrée et parking disponible ! Ouverture de la barrière...");
      barriereServo.write(90); // Ouvre la barrière à 90 degrés
      barriereOuverte = true;
      tempsOuverture = millis();
    } else {
      // Le parking est complet
      // On peut ajouter un message ici si souhaité
    }
  }

  // Fermeture automatique de la barrière après 5 secondes
  if (barriereOuverte && (millis() - tempsOuverture > 5000)) {
    Serial.println("🛑 Fermeture de la barrière.");
    barriereServo.write(0); // Ferme la barrière à 0 degrés
    barriereOuverte = false;
  }

  delay(200); // Petite pause pour la stabilité
}