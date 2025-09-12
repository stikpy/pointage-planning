# 📸 Configuration Supabase Storage

## ✅ Bucket créé avec succès

Le bucket `clock-photos` a été créé et configuré avec :
- **Public** : ✅ Oui
- **Types MIME autorisés** : image/jpeg, image/png, image/webp
- **Taille max** : 5MB

## 🔒 Configuration des politiques de sécurité

### 1. Aller dans Supabase Dashboard
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Storage** > **Policies**

### 2. Configurer les politiques pour le bucket `clock-photos`

#### Politique 1 : Upload de photos
```sql
CREATE POLICY "Users can upload their own photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'clock-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Politique 2 : Visualisation des photos
```sql
CREATE POLICY "Users can view their own photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'clock-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Politique 3 : Suppression des photos
```sql
CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'clock-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Politique 4 : Accès public en lecture (optionnel)
```sql
CREATE POLICY "Public read access for clock photos" ON storage.objects
FOR SELECT USING (bucket_id = 'clock-photos');
```

### 3. Alternative : Politiques simplifiées

Si vous voulez permettre l'accès à tous les utilisateurs authentifiés :

```sql
-- Upload pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'clock-photos' AND
  auth.role() = 'authenticated'
);

-- Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can view photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'clock-photos' AND
  auth.role() = 'authenticated'
);

-- Suppression pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'clock-photos' AND
  auth.role() = 'authenticated'
);
```

## 🧪 Test de l'upload

Une fois les politiques configurées, testez l'upload :

1. Allez sur http://localhost:3001
2. Scannez un QR code
3. Prenez une photo lors de la vérification d'identité
4. Vérifiez que la photo apparaît dans Supabase Storage

## 📋 Vérification

### Dans Supabase Dashboard :
1. **Storage** > **clock-photos** : Vérifiez que les photos sont uploadées
2. **Database** > **clock_photos** : Vérifiez que les métadonnées sont sauvegardées

### Dans l'application :
1. Les photos doivent s'afficher dans la galerie
2. Les URLs des photos doivent être accessibles
3. Le téléchargement doit fonctionner

## 🔧 Dépannage

### Erreur "Policy not found"
- Vérifiez que les politiques sont bien créées
- Redémarrez l'application après création des politiques

### Erreur "Upload failed"
- Vérifiez les types MIME autorisés
- Vérifiez la taille du fichier (max 5MB)
- Vérifiez les permissions du bucket

### Photos non visibles
- Vérifiez que le bucket est public
- Vérifiez les politiques de lecture
- Vérifiez les URLs générées

## ✨ Fonctionnalités

Avec cette configuration, vous avez :
- ✅ Upload automatique des photos vers Supabase Storage
- ✅ Sauvegarde des métadonnées en base de données
- ✅ URLs publiques pour les photos
- ✅ Galerie de photos intégrée
- ✅ Téléchargement des photos
- ✅ Suppression des photos
- ✅ Sécurité avec RLS
