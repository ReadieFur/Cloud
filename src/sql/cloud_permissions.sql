CREATE TABLE `cloud_permissions` (
    `uid` char(128) NOT NULL PRIMARY KEY,
    `files` tinyint(1) NOT NULL DEFAULT '0',
    FOREIGN KEY (`uid`) REFERENCES `users` (`uid`)
)