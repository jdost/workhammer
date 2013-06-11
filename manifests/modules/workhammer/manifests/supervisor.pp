class workhammer::supervisor {
   package { 'supervisor':
      ensure => present,
      require => Exec['update'],
   }

   file { '/etc/supervisor/supervisord.conf':
      ensure  => present,
      content => template('workhammer/supervisord.conf.erb'),
      require => Package['supervisor'],
   }

   file { '/etc/supervisor/conf.d/workhammer.conf':
      ensure  => present,
      content => template('workhammer/workhammer.conf.erb'),
      require => File["/etc/supervisor/supervisord.conf"],
   }

   service { 'supervisor':
      ensure     => running,
      enable     => true,
      hasrestart => true,
      require    => File['/etc/supervisor/conf.d/workhammer.conf'],
   }
}
