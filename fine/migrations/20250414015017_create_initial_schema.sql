-- Create photos table
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  imageUrl TEXT NOT NULL,
  category TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  dateCreated TEXT NOT NULL
);

-- Create categories table
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Create contact messages table
CREATE TABLE contactMessages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  dateSubmitted TEXT NOT NULL
);

-- Insert sample categories
INSERT INTO categories (name) VALUES ('Landscape');
INSERT INTO categories (name) VALUES ('Portrait');
INSERT INTO categories (name) VALUES ('Street');
INSERT INTO categories (name) VALUES ('Architecture');
INSERT INTO categories (name) VALUES ('Nature');

-- Insert sample photos
INSERT INTO photos (title, description, imageUrl, category, featured, dateCreated) VALUES 
('Mountain Sunrise', 'Beautiful sunrise over mountain range', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 'Landscape', true, '2023-01-15'),
('Urban Exploration', 'City streets at night with neon lights', 'https://images.unsplash.com/photo-1519608487953-e999c86e7455', 'Street', true, '2023-02-20'),
('Portrait of Emma', 'Studio portrait with natural lighting', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2', 'Portrait', false, '2023-03-05'),
('Ancient Architecture', 'Historical building with intricate details', 'https://images.unsplash.com/photo-1495562569060-2eec283d3391', 'Architecture', true, '2023-04-10'),
('Forest Pathway', 'Mystical path through dense forest', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'Nature', false, '2023-05-22'),
('Ocean Waves', 'Powerful waves crashing on rocky shore', 'https://images.unsplash.com/photo-1518837695005-2083093ee35b', 'Landscape', false, '2023-06-30'),
('City Skyline', 'Panoramic view of downtown at sunset', 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df', 'Architecture', true, '2023-07-14'),
('Wildlife Close-up', 'Detailed shot of a wild fox', 'https://images.unsplash.com/photo-1474511320723-9a56873867b5', 'Nature', true, '2023-08-02'),
('Street Vendor', 'Local food vendor in busy market', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', 'Street', false, '2023-09-17'),
('Mountain Lake', 'Pristine alpine lake reflecting mountains', 'https://images.unsplash.com/photo-1439853949127-fa647821eba0', 'Landscape', false, '2023-10-05'),
('Modern Building', 'Contemporary architecture with glass facade', 'https://images.unsplash.com/photo-1486325212027-8081e485255e', 'Architecture', false, '2023-11-20'),
('Portrait of James', 'Environmental portrait in natural setting', 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126', 'Portrait', true, '2023-12-08');