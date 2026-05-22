#include <PubSubClient.h>
#include <WiFi.h>

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

  setup_wifi();                             // Connexion au WiFi
  client.setServer(mqtt_server, mqtt_port); // Configuration du broker
}

void loop() {
  // S'assurer qu'on est toujours connecté au MQTT
  if (!client.connected()) {
    reconnect();
  }
  client.loop(); // Essentiel pour maintenir la connexion active en arrière-plan

  // Lecture et envoi de l'état de chaque capteur
  for (int i = 0; i < NUM_CAPTEURS; i++) {
    int etatActuel = digitalRead(capteurPins[i]);

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

  delay(200); // Petite pause pour la stabilité
}