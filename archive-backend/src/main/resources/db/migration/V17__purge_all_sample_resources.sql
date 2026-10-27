-- V17: Purge all resources, bookmarks, and reviews for a completely fresh clean slate
UPDATE posts SET linked_resource_id = NULL;
DELETE FROM resource_bookmarks;
DELETE FROM resource_reviews;
DELETE FROM resources;
