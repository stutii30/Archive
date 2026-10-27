-- V16: Clean up all uploaded resources, bookmarks, and reviews for a fresh site launch
DELETE FROM resource_bookmarks;
DELETE FROM resource_reviews;
DELETE FROM resources;
