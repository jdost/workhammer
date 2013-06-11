class supervisor {
   package { 'supervisor': ensure => present, }

   file { 'supervisor':
      path    => '/etc/supervisor/supervisord.conf',
      ensure  => present,
      content => template('supervisor/supervisord.conf.erb'),
      require => Package['supervisor'],
   }

   service { 'supervisor':
      ensure     => running,
      enable     => true,
      hasrestart => true,
      require    => File['supervisor'],
   }
}
