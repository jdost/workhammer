exec { 'update': command => "/usr/bin/apt-get update", }

package { 'ncurses-term': ensure => present, require => Exec['update'], }

user { 'vagrant':
   ensure      => present,
   shell       => '/bin/zsh',
   home        => '/home/vagrant',
   managehome  => true,
}

package { 'zsh':
   ensure  => present,
   before  => User['vagrant'],
   require => Exec['update'],
}

file { '/home/vagrant/.zshrc':
   ensure  => file,
   mode    => 644,
   require => User['vagrant'],
}

