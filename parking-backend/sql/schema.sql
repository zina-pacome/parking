DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS paiements;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS entrees_sorties;
DROP TABLE IF EXISTS vehicules;
DROP TABLE IF EXISTS places;
DROP TABLE IF EXISTS tarifs;
DROP TABLE IF EXISTS utilisateurs;

CREATE TABLE utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  role ENUM('admin', 'agent') DEFAULT 'agent',
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tarifs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  type ENUM('heure', 'forfait_jour', 'abonnement_mois') NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE places (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(10) NOT NULL UNIQUE,
  zone VARCHAR(5) NOT NULL DEFAULT 'A',
  etage INT DEFAULT 0,
  type ENUM('standard', 'moto', 'handicape', 'vip') DEFAULT 'standard',
  statut ENUM('libre', 'occupee', 'reservee', 'hors_service') DEFAULT 'libre',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plaque VARCHAR(20) NOT NULL,
  type ENUM('voiture', 'moto', 'camion', 'autre') DEFAULT 'voiture',
  marque VARCHAR(50),
  couleur VARCHAR(30),
  nom_conducteur VARCHAR(100),
  telephone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE entrees_sorties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicule_id INT NOT NULL,
  place_id INT NOT NULL,
  utilisateur_id INT,
  heure_entree DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  heure_sortie DATETIME,
  duree_minutes INT,
  statut ENUM('en_cours', 'termine') DEFAULT 'en_cours',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicule_id) REFERENCES vehicules(id),
  FOREIGN KEY (place_id) REFERENCES places(id),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

CREATE TABLE paiements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entree_sortie_id INT NOT NULL,
  tarif_id INT,
  montant DECIMAL(10,2) NOT NULL,
  methode ENUM('especes', 'carte', 'mobile') DEFAULT 'especes',
  statut ENUM('paye', 'en_attente', 'annule') DEFAULT 'paye',
  utilisateur_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entree_sortie_id) REFERENCES entrees_sorties(id),
  FOREIGN KEY (tarif_id) REFERENCES tarifs(id),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicule_id INT NOT NULL,
  place_id INT NOT NULL,
  utilisateur_id INT,
  debut DATETIME NOT NULL,
  fin DATETIME NOT NULL,
  statut ENUM('active', 'confirmee', 'annulee', 'expiree') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicule_id) REFERENCES vehicules(id),
  FOREIGN KEY (place_id) REFERENCES places(id),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

CREATE TABLE logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

-- Tarifs par défaut
INSERT INTO tarifs (nom, type, montant) VALUES
('Tarif horaire standard', 'heure', 2000),
('Forfait journalier', 'forfait_jour', 15000),
('Abonnement mensuel', 'abonnement_mois', 150000);

-- 20 places
INSERT INTO places (numero, zone, etage, type) VALUES
('A01','A',0,'standard'),('A02','A',0,'standard'),('A03','A',0,'standard'),
('A04','A',0,'standard'),('A05','A',0,'standard'),('A06','A',0,'moto'),
('A07','A',0,'moto'),('A08','A',0,'handicape'),('A09','A',0,'vip'),
('A10','A',0,'standard'),('B01','B',1,'standard'),('B02','B',1,'standard'),
('B03','B',1,'standard'),('B04','B',1,'standard'),('B05','B',1,'standard'),
('B06','B',1,'moto'),('B07','B',1,'standard'),('B08','B',1,'standard'),
('B09','B',1,'vip'),('B10','B',1,'standard');

-- Utilisateurs par défaut (mot de passe : password)
INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES
('Administrateur', 'admin@parking.mg', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Agent 1', 'agent@parking.mg', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent');