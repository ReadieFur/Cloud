CREATE TABLE `cloud_file_shares` (
    `id` char(128) NOT NULL PRIMARY KEY,
    `fid` char(128) NOT NULL,
    `uid` char(128) NOT NULL,
    FOREIGN KEY (`fid`) REFERENCES `cloud_files`(`id`),
    FOREIGN KEY (`uid`) REFERENCES `users`(`uid`)
)