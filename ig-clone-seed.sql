-- This file will contain seed data for database
-- Create fake user + post data which will be added to the tables. 


INSERT INTO users (id, username, password, first_name, last_name, email, profile_image, bio, is_admin)
VALUES (1000,
        'arnold',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        'Arnold',
        'Test',
        'arnold@test.com',
        'https://i.pinimg.com/474x/6e/52/c7/6e52c7fe2447e34bc447b027cc20ea7d.jpg',
        'Bay Area born and raised',
        FALSE),
        (1001,
        'dan',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        'Dan',
        'Test',
        'dan@test.com',
        'https://sportshub.cbsistatic.com/i/2021/08/09/b9334c48-cc42-474f-ae5e-b2b3b0884cb0/one-piece-wano-zoro-1277439.jpg',
        'Bay Area is the best place in the world.',
        FALSE),
        (1002,
        'chris',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        'Chris',
        'Test',
        'chris@test.com',
        'https://www.comingsoon.net/assets/uploads/2022/04/tony-tony-chopper-poster-one-piece-film-red.jpg',
        'I like to post a lot of food and traveling photos!',
        FALSE),
        (1003,
        'jim',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        'Jim',
        'Test',
        'jim@test.com',
        'https://animementor.com/wp-content/uploads/2022/08/usopp-wiki.webp?ezimgfmt=rs:355x355/rscb7/ngcb7/notWebP',
        'Follow my journey around the world!',
        FALSE),
        (1004,
        'ash',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        'Ash',
        'Test',
        'ash@test.com',
        'https://img.wattpad.com/5b7deddbf42cfff1c6afa7cf57820094d7e3d631/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f776174747061642d6d656469612d736572766963652f53746f7279496d6167652f566b674c397630764f4f74797a673d3d2d3837343233383833392e313630396135323031613832356163333437333639383438373931302e6a7067',
        'A mix of things I like and enjoy in life.',
        FALSE)
       ;

INSERT INTO posts (id, image_file, caption, user_id)
VALUES (1000, 'https://i2-prod.dailystar.co.uk/incoming/article27095568.ece/ALTERNATES/s1200b/0_Liverpool-FC-v-Real-Madrid-UEFA-Champions-League-Final-202122.jpg', 'Hala Madrid!', 1000),
        (1001, 'https://i2-prod.mirror.co.uk/incoming/article14323105.ece/ALTERNATES/s1200b/0_FBL-ENG-PR-LIVERPOOL-CHELSEA.jpg', 'Salah!', 1000),
        (1002, 'https://cdn.vox-cdn.com/thumbor/y4rckb9Uhw7fEiHEtjZNAyIzOB8=/0x0:500x373/1400x1050/filters:focal(210x147:290x227):format(jpeg)/cdn.vox-cdn.com/uploads/chorus_image/image/53674155/tumblr_inline_ohujmuFKMg1r9z6eg_540.0.jpg', 'Its Pikachu!', 1000),
        (1003, 'https://gaijinpot.scdn3.secure.raxcdn.com/app/uploads/sites/6/2016/02/Mount-Fuji-New.jpg', 'I need a vacation', 1001),
        (1004, 'https://pbs.twimg.com/media/FMJvrtVXEAQchcP?format=jpg&name=4096x4096', 'Throwback', 1001),
        (1005, 'https://www.traveldailymedia.com/assets/2021/06/shutterstock_1488841433-1-1.jpg', 'Need to visit again', 1001),
        (1006, 'https://media.cntraveler.com/photos/60480c67ff9cba52f2a91899/16:9/w_2560%2Cc_limit/01-velo-header-seattle-needle.jpg', 'This city is beautiful', 1002),
        (1007, 'https://i.ytimg.com/vi/cnHYC1YN1aU/maxresdefault.jpg', 'What a time!', 1002),
        (1008, 'https://static01.nyt.com/images/2020/03/10/arts/10virus-coachella1/10virus-coachella1-facebookJumbo.jpg?year=2020&h=550&w=1050&s=38019d51075a9c885c5a67dc7b3e0cdfbb555b0ff3e4c54f00c6f37cea6f4bdd&k=ZQJBKqZ0VN', 'Coachella!!!', 1003),
        (1009, 'https://worldstrides.com/wp-content/uploads/2015/07/iStock_000061296808_Large-1.jpg', 'Bay Area!!!!!!!', 1003),
        (1010, 'https://media.timeout.com/images/105599863/image.jpg', 'Best pizza ever', 1003),
        (1011, 'https://www.frommers.com/system/media_items/attachments/000/868/450/s980/Frommers-New-York-Central-Park-1190x768.jpg?1647003577', 'Big Apple', 1003),
        (1012, 'https://cdn.nba.com/manage/2022/06/stephen-curry-celebrates-finals-mvp.jpg', '2022 Champs!', 1004);

INSERT INTO likes (user_id, post_id)
VALUES 
    (1000, 1001),
    (1000, 1002),
    (1000, 1003),
    (1001, 1005),
    (1001, 1006),
    (1001, 1012),
    (1003, 1001),
    (1003, 1005),
    (1003, 1006),
    (1004, 1006),
    (1004, 1007),
    (1004, 1009),
    (1004, 1010);

-- posts 1000, 1004, 1008, 1011 do not have likes

INSERT INTO comments (id, user_id, post_id, comment)
VALUES 
    (500, 1000, 1001, 'looks fun!'),
    (501, 1000, 1002, 'looks fun!'),
    (502, 1000, 1007, 'looks fun!'),
    (503, 1002, 1002, 'that looks so good'),
    (504, 1004, 1004, 'invite me next time!'),
    (505, 1004, 1005, 'LOL'),
    (506, 1004, 1006, 'tfti'),
    (507, 1003, 1008, 'best team in the world'),
    (508, 1003, 1009, 'congrats!'),
    (509, 1002, 1004, 'cute!'),
    (510, 1001, 1005, 'noooooooo');

INSERT INTO follows (user_following_id, user_followed_id)
VALUES 
    (1000, 1001),
    (1000, 1002),
    (1000, 1003),
    (1000, 1004),
    (1001, 1000),
    (1001, 1002),
    (1002, 1001),
    (1002, 1003),
    (1003, 1000),
    (1003, 1001),
    (1003, 1002),
    (1003, 1004),
    (1004, 1001),
    (1004, 1003);


