class mongo {
   package { 'mongodb-server': ensure  => installed, }

   service { 'mongodb':
      enable  => true,
      ensure  => running,
      require => Package['mongodb-server'],
   }
}
