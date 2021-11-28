CREATE TABLE `cloud_files` (
    `id` char(128) NOT NULL PRIMARY KEY,
    `uid` char(128) NOT NULL,
    `name` varchar(256) NOT NULL DEFAULT 'Untitled file',
    `type` char(128) DEFAULT NULL,
    `size` varchar(128) NOT NULL DEFAULT '0',
    `metadata` varchar(256) NOT NULL,
    `shareType` tinyint(4) NOT NULL DEFAULT '0' COMMENT '0 - private,\r\n1 - invite,\r\n2 - public',
    `dateAltered` varchar(32) NOT NULL,
    FOREIGN KEY (`uid`) REFERENCES `cloud_permissions`(`uid`)
)