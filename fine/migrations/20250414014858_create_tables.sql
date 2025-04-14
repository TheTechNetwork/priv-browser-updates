CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  imageUrl TEXT NOT NULL,
  category TEXT NOT NULL,
  featured BOOLEAN DEFAULT false,
  dateCreated TEXT NOT NULL
);

CREATE TABLE contact (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  dateSubmitted TEXT NOT NULL
);

-- Insert some initial categories
INSERT INTO categories (name) VALUES ('Nature');
INSERT INTO categories (name) VALUES ('Portrait');
INSERT INTO categories (name) VALUES ('Architecture');
INSERT INTO categories (name) VALUES ('Street');

-- Insert some sample photos
INSERT INTO photos (title, description, imageUrl, category, featured, dateCreated) 
VALUES 
('Mountain Sunset', 'Beautiful sunset over mountain range', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000', 'Nature', true, '2023-01-15'),
('Urban Jungle', 'Modern architecture in the city', 'https://images.unsplash.com/photo-1486718448742-163732cd1544?q=80&w=1000', 'Architecture', true, '2023-02-20'),
('Portrait Study', 'Studio portrait with dramatic lighting', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1000', 'Portrait', false, '2023-03-10'),
('City Life', 'Busy street scene in downtown', 'https://images.unsplash.com/photo-1519575706483-221027bfbb31?q=80&w=1000', 'Street', false, '2023-04-05'),
('Forest Path', 'Misty morning in the forest', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000', 'Nature', true, '2023-05-12'),
('Glass Tower', 'Modern glass skyscraper reflecting clouds', 'https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=1000', 'Architecture', false, '2023-06-18'),
('Candid Moment', 'Spontaneous portrait in natural light', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000', 'Portrait', true, '2023-07-22'),
('Market Day', 'Vibrant street market scene', 'https://images.unsplash.com/photo-1555679486-e341a3e7b6de?q=80&w=1000', 'Street', false, '2023-08-30');